using System.ComponentModel.DataAnnotations.Schema;
using System.Data.Entity.ModelConfiguration;
using CloudDiagram.Web.EF.Models;

namespace CloudDiagram.Web.EF.Mapping
{
    public class WorkgroupMap : EntityTypeConfiguration<Workgroup>
    {
        public WorkgroupMap()
        {
            HasKey(t => t.Id);
            Property(t => t.Id).HasDatabaseGeneratedOption(DatabaseGeneratedOption.Identity);

	        HasRequired(t => t.Account)
		        .WithMany(t => t.Workgroups)
		        .HasForeignKey(t => t.AccountId);
        }
    }
}