using System.Xml.Serialization;
using TypeLite;

namespace CloudDiagram.Web.Models
{
    [TsClass]
    [XmlType("style")]
    public class MindMapNodeStyle
    {
        public int Id { get; set; }
        /// <summary>
        /// Id of the style this style is based on
        /// </summary>
        public int? ParentId { get; set; }
        public string FillColor { get; set; }
        public string StrokesColor { get; set; }
    }

    [TsClass]
    [XmlType("node")]
    public class MindMapNode
    {
        public int Id { get; set; }
        public string Text { get; set; }
        public int? StyleId { get; set; }
    }

    [TsClass]
    [XmlType("link")]
    public class MindMapLink
    {
        public int From { get; set; }
        public int To { get; set; }
        public bool? Left { get; set; }
    }

    [TsClass]
    public class MindMapBasicDto
    {
        public decimal Version { get; set; }
    }

    [TsClass]
    [XmlType("mindMap")]
    public class MindMapDto : MindMapBasicDto
    {
        public MindMapNodeStyle[] NodeStyles { get; set; }
        public MindMapNode[] Nodes { get; set; }
        public MindMapLink[] Links { get; set; }
    }
}