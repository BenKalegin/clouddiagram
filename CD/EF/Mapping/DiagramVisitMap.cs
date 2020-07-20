using System.ComponentModel.DataAnnotations.Schema;
using System.Data.Entity.ModelConfiguration;
using CloudDiagram.Web.EF.Models;

namespace CloudDiagram.Web.EF.Mapping
{
	public class DiagramVisitMap : EntityTypeConfiguration<DiagramVisit>
	{
		public DiagramVisitMap()
		{
			HasKey(t => t.Id);
			Property(t => t.Id).HasDatabaseGeneratedOption(DatabaseGeneratedOption.Identity);

			HasRequired(t => t.VisitedBy)
				.WithMany(t => t.Visits)
				.HasForeignKey(t => t.VisitedById)
				.WillCascadeOnDelete(false);

			HasRequired(t => t.Diagram)
				.WithMany()
				.HasForeignKey(t => t.DiagramId);
		}
	}
}