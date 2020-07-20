using System;

namespace CloudDiagram.Web.EF.Models
{
	public class DiagramChange
	{
		public int Id { get; set; }
		public DateTime When { get; set; }
		public int VersionBefore { get; set; }
		public int VersionAfter { get; set; }
		public int DiagramId { get; set; }
		public virtual Diagram Diagram { get; set; }
		public int ChangedById { get; set; }
		public virtual User ChangedBy { get; set; }
	}
}