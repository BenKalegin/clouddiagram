using System;
using System.Collections.Generic;
using System.IO;
using System.Reflection;
using System.Text;
using System.Text.RegularExpressions;
using System.Xml.Serialization;

namespace CloudDiagram.Web.EF
{
    public class XmlMarshal
    {
        static readonly IDictionary<string, Type> TypeCache = new Dictionary<string, Type>();
        private const string XmlVersionEncodingUtf = "<?xml version=\"1.0\" encoding=\"utf-16\"?>\n\r";


        public static T ReadContext<T>(string s)
        {
			return (T) Deserialize(s, typeof(T));
        }

        public static object ReadContext(string s)
        {
            var regex = new Regex(@"<([\w\d]+)");
            var rootNode = string.IsNullOrEmpty(s) ? null : regex.Match(s).ToString().Remove(0, 1);
            if (!string.IsNullOrEmpty(rootNode))
            {
                Type type = FindContextClass(rootNode);
                if (type != null)
                {
                    return Deserialize(s, type);
                }
            }
            return null;
        }

    	private static object Deserialize(string s, Type type)
    	{
    		var serializer = new XmlSerializer(type);
    		if (!s.StartsWith("<?xml"))
    			s = XmlVersionEncodingUtf + s;
    		try
    		{
    			return serializer.Deserialize(new StringReader(s));
    		}
    		catch (Exception e)
    		{
    			throw new InvalidDataException("Bad xml:\n\r" + s, e);
    		}
    	}

    	private static Type FindContextClass(string rootNode)
        {
            Type result;
            if (!TypeCache.TryGetValue(rootNode, out result))
            {
                var types = Assembly.GetExecutingAssembly().GetTypes();
                foreach (var t in types)
                {
                    //var attrs = t.GetCustomAttributes(typeof(XmlRootAttribute), true);
                    if (t.Name == rootNode)
                    {
                        result = t;
                        break;
                    }
                }
                TypeCache.Add(rootNode, result);
            }
            return result;
        }

        public static string WriteContext(object context)
        {
            var serializer = new XmlSerializer(context.GetType());
            var sb = new StringBuilder();
            serializer.Serialize(new StringWriter(sb), context);
            return sb.ToString();
        }

    }
}