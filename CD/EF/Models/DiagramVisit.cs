using System;

namespace CloudDiagram.Web.EF.Models
{
	public class DiagramVisit
	{
		public int Id { get; set; }
		public DateTime When { get; set; }
		public int Version { get; set; }
		public int DiagramId { get; set; }
		public virtual Diagram Diagram { get; set; }
		public int VisitedById { get; set; }
		public virtual User VisitedBy { get; set; }
	}
}