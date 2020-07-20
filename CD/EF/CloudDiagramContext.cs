using System;
using System.Data.Entity;
using System.Data.Entity.Core.Objects;
using System.Data.Entity.Infrastructure;
using System.Data.Entity.Validation;
using System.Linq;
using CloudDiagram.Web.EF.Mapping;
using CloudDiagram.Web.EF.Models;
using CloudDiagram.Web.Migrations;
using CloudDiagram.Web.Services.Utils;
using Microsoft.AspNet.Identity.EntityFramework;

namespace CloudDiagram.Web.EF
{
    public class CloudDiagramContext : IdentityDbContext<User, Role, int, UserLogin, UserRole, UserClaim>{
        private readonly DatabaseDescriptor _databaseDescriptor;
        static CloudDiagramContext()
	    {
		    Database.SetInitializer(new MigrateDatabaseToLatestVersion<CloudDiagramContext, Configuration>()); 
	    }

	    public CloudDiagramContext() : base("CloudDiagram")
	    {
	        Configuration.UseDatabaseNullSemantics = true;
            _databaseDescriptor = DatabaseDescriptor.Get(this);
        }

	    public DbSet<Account> Accounts { get; set; }
        public DbSet<Anonymous> Anonymouses { get; set; }
        public DbSet<Diagram> Diagrams { get; set; }
        public DbSet<DiagramChange> DiagramChanges { get; set; }
        public DbSet<DiagramVisit> DiagramVisits { get; set; }
        //public DbSet<Models.User> Users { get; set; }
        public DbSet<UserLogin> UserLogins { get; set; }
        public DbSet<UserRole> UserRoles { get; set; }
        public DbSet<UserClaim> UserClaims { get; set; }
        public DbSet<Workgroup> Workgroups { get; set; }

        public Anonymous AnonymousByToken(string token)
        {
            var hashCode = token.GetHashCode();
            return Anonymouses.SingleOrDefault(a => a.TokenHash == hashCode && a.Token == token);
        }
        protected override void OnModelCreating(DbModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Configurations.Add(new AccountMap());
            modelBuilder.Configurations.Add(new AnonymousMap());
            modelBuilder.Configurations.Add(new DiagramMap());
            modelBuilder.Configurations.Add(new DiagramChangeMap());
            modelBuilder.Configurations.Add(new DiagramVisitMap());
            modelBuilder.Configurations.Add(new UserMap());
            modelBuilder.Configurations.Add(new WorkgroupMap());
        }

        public ObjectContext ObjectContext
        {
            get { return ((IObjectContextAdapter)this).ObjectContext; }
        }
        private void DateTimeZeroCheck()
        {
            _databaseDescriptor.DateTimeZeroCheck(ObjectContext);
        }

        private void StringOverflowCheck()
        {
            _databaseDescriptor.StringOverflowCheck(ObjectContext);
        }
        public override int SaveChanges()
        {
            StringOverflowCheck();
            DateTimeZeroCheck();
            try
            {
                return base.SaveChanges();
            }
            catch (DbEntityValidationException e)
            {
                throw DescribeValidationErrors(e);
            }
        }

        private static Exception DescribeValidationErrors(DbEntityValidationException e)
        {
            String s = "";
            foreach (var eve in e.EntityValidationErrors)
            {
                s += String.Format("Entity of type \"{0}\" in state \"{1}\" has the following validation errors:\n\r", eve.Entry.Entity.GetType().Name, eve.Entry.State);
                s = eve.ValidationErrors.Aggregate(s, (current, ve) => current + String.Format("- Property: \"{0}\", Error: \"{1}\"", ve.PropertyName, ve.ErrorMessage));
            }
            return new DbEntityValidationException(s, e.EntityValidationErrors);
        }

        public string GeneratePublicId()
        {
            while (true)
            {
                var intValue = new Random().Next(int.MaxValue);
                var result = Base32.ToBase32String(new Int32Converter(intValue).ToBytes());
                if (!Diagrams.Any(d => d.PublicId == result))
                    return result;
            }
        }
    }
}