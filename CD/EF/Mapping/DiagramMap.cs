using System.ComponentModel.DataAnnotations.Schema;
using System.Data.Entity;
using System.Data.Entity.ModelConfiguration;
using CloudDiagram.Web.EF.Models;

namespace CloudDiagram.Web.EF.Mapping
{
    public class DiagramMap : EntityTypeConfiguration<Diagram>
    {
        public DiagramMap()
        {
            HasKey(t => t.Id);
            Property(t => t.Id).HasDatabaseGeneratedOption(DatabaseGeneratedOption.Identity);

            HasRequired(t => t.Workgroup)
                .WithMany(t => t.Diagrams)
                .HasForeignKey(t => t.WorkgroupId);


			HasRequired(t => t.CreatedBy)
                .WithMany()
                .HasForeignKey(t => t.CreatedById);

			this.HasIndex("UX_Diagram_PublicId", IndexOptions.Unique, e => e.Property(t => t.PublicId));
        }
    }
}