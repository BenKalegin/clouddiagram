using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Data.Entity.Core.Metadata.Edm;
using System.Data.Entity.Core.Objects;
using System.Data.Entity.Core.Objects.DataClasses;
using System.Data.Entity.Infrastructure;
using System.Diagnostics;
using System.Linq;
using System.Reflection;

namespace CloudDiagram.Web.EF
{
    public class ColumnDesc
    {
        public int MaxLength;
        public byte Scale;
        public bool? Nullable;
        public string Name;

        public ColumnDesc(string name, bool nullable, int maxLength, byte scale)
        {
            MaxLength = maxLength;
            Scale = scale;
            Nullable = nullable;
            Name = name;
        }

        public override string ToString()
        {
            return string.Format("{0}|{1}|{2}|{3}", Name, Nullable, MaxLength, Scale);
        }
    }

    public class DatabaseDescriptor
    {
        static readonly object _byTypeLock = new object();
        static readonly Dictionary<Type, DatabaseDescriptor> _descriptorByType = new Dictionary<Type, DatabaseDescriptor>();

        Dictionary<string, Dictionary<string, ColumnDesc>> fieldDescriptors;

        public static DatabaseDescriptor Get(ObjectContext db)
        {
            DatabaseDescriptor result;
            lock (_byTypeLock)
            {
                var type = db.GetType();
                if (!_descriptorByType.TryGetValue(type, out result))
                {
                    result = new DatabaseDescriptor(db);
                    _descriptorByType[type] = result;
                }
            }
            return result;
        }

        public static bool IsEntity(Type pType)
        {
            return !IsSimpleType(pType) && !pType.IsGenericType;
        }

        static public bool IsSimpleType(Type pType)
        {
            return pType.IsPrimitive || pType.IsValueType || pType == typeof(string) || pType == typeof(Decimal) || pType == typeof(DateTime) || pType == typeof(byte[]);
        }

        public static PropertyInfo[] GetColumns(Type entityType)
        {
            var columns = entityType.GetProperties(BindingFlags.Public | BindingFlags.Instance | BindingFlags.DeclaredOnly);
            if (IsEntity(entityType))
                columns = columns.Where(IsRealColumn).ToArray();
            return columns;
        }

        static bool IsRealColumn(PropertyInfo prop)
        {
            var pType = prop.PropertyType;
            return
                prop.CanWrite &&
                !IsEntity(pType) &&
                !pType.IsSubclassOf(typeof(EntityReference)) &&
                !pType.IsSubclassOf(typeof(RelatedEnd)) &&
                (!pType.IsGenericType || pType.GetGenericTypeDefinition() == typeof(Nullable<>));
        }

        public static DatabaseDescriptor Get(DbContext db)
        {
            ObjectContext objContext = ((IObjectContextAdapter)db).ObjectContext;
            return Get(objContext);
        }

        DatabaseDescriptor(ObjectContext db)
        {
            InitializeMetadata(db);
            _descriptorByType[db.GetType()] = this;
        }

        public ColumnDesc[] DbInfo(Type t)
        {
            Dictionary<string, ColumnDesc> entity;
            if (fieldDescriptors.TryGetValue(t.Name, out entity))
                return entity.Values.ToArray();
            return null;
        }

        public ColumnDesc DbInfo(PropertyInfo member)
        {
            Dictionary<string, ColumnDesc> entity;
            ColumnDesc result;

            if (fieldDescriptors.TryGetValue(member.ReflectedType.Name, out entity) && entity.TryGetValue(member.Name, out result))
                return result;
            throw new Exception(String.Format("Member not found: {0}.{1}", member.ReflectedType.Name, member.Name));
        }

        void InitializeMetadata(ObjectContext ctx)
        {
            if (fieldDescriptors != null)
                return;
            fieldDescriptors = new Dictionary<string, Dictionary<string, ColumnDesc>>();

            var items = ctx.MetadataWorkspace.GetItems(DataSpace.CSpace);
            Debug.Assert(items != null);
            var tables = items.Where(m => m.BuiltInTypeKind == BuiltInTypeKind.EntityType || m.BuiltInTypeKind == BuiltInTypeKind.ComplexType);

            foreach (StructuralType table in tables)
            {
                var fieldsMap = new Dictionary<string, ColumnDesc>();
                fieldDescriptors[table.Name] = fieldsMap;
                ReadOnlyMetadataCollection<EdmProperty> props = null;
                var complexType = table as ComplexType;
                if (complexType != null)
                    props = complexType.Properties;

                var entityType = table as EntityType;
                if (entityType != null)
                    props = entityType.Properties;
                Debug.Assert(props != null);

                var fields = props.Where(p => p.DeclaringType.Name == table.Name);
                foreach (var field in fields)
                {
                    int maxLength = 0;
                    byte scale = 0;

                    if (field.TypeUsage.EdmType.Name == "String")
                    {
                        var value = field.TypeUsage.Facets["MaxLength"].Value;
                        if (value is Int32)
                            maxLength = Convert.ToInt32(value);
                        else
                            // unbounded
                            maxLength = Int32.MaxValue;
                    }
                    else if (field.TypeUsage.EdmType.Name == "Decimal")
                    {
                        var value = field.TypeUsage.Facets["Scale"].Value;
                        scale = Convert.ToByte(value);
                    }
                    var desc = new ColumnDesc(field.Name, field.Nullable, maxLength, scale);
                    fieldsMap[field.Name] = desc;
                }
            }
        }

        public void StringOverflowCheck(ObjectContext db)
        {
            var modified = db.ObjectStateManager.GetObjectStateEntries(EntityState.Added | EntityState.Modified);
            foreach (var entry in modified.Where(entry => !entry.IsRelationship))
            {
                var entity = entry.Entity;
                Debug.Assert(entity != null);
                var type = entity.GetType();
                if (type.BaseType != null && type.Namespace == "System.Data.Entity.DynamicProxies")
                {
                    type = type.BaseType;
                }
                var fieldMap = fieldDescriptors[type.Name];
                foreach (var key in fieldMap.Keys)
                {
                    if (fieldMap[key].MaxLength > 0)
                    {
                        var value = (string)type.GetProperty(key).GetValue(entity, null);
                        if (value != null && value.Length > fieldMap[key].MaxLength)
                            throw new Exception(String.Format("String Overflow on Table {0} Column {1}: {2} out of {3} with value'{4}' ", type, key, value.Length, fieldMap[key].MaxLength, value));
                    }
                }
            }
        }

        public void DateTimeZeroCheck(ObjectContext db)
        {
            var modified = db.ObjectStateManager.GetObjectStateEntries(EntityState.Added | EntityState.Modified);
            foreach (var entry in modified.Where(entry => !entry.IsRelationship))
            {
                var entity = entry.Entity;
                Debug.Assert(entity != null);
                var type = entity.GetType();
                foreach (var prop in type.GetProperties().Where(p => p.PropertyType == typeof(DateTime)))
                {
                    var value = (DateTime)prop.GetValue(entity, null);
                    if (value == DateTime.MinValue)
                        throw new Exception(String.Format("Datetime2 is 0 Table {0} Column {1}", type, prop.Name));
                }
                foreach (var prop in type.GetProperties().Where(
                    p => p.PropertyType.IsGenericType &&
                        p.PropertyType.GetGenericTypeDefinition() == typeof(Nullable<>) &&
                            p.PropertyType.GetGenericArguments()[0] == typeof(DateTime)))
                {
                    var value = (DateTime?)prop.GetValue(entity, null);
                    if (value == DateTime.MinValue)
                        throw new Exception(String.Format("Datetime2 is 0 Table {0} Column {1}", type, prop.Name));
                }
            }

        }
    }
}