using System.ComponentModel.DataAnnotations.Schema;
using System.Data.Entity.ModelConfiguration;
using CloudDiagram.Web.EF.Models;
using System.Data.Entity;

namespace CloudDiagram.Web.EF.Mapping
{
    public class AnonymousMap : EntityTypeConfiguration<Anonymous>
    {
        public AnonymousMap()
        {
            HasKey(t => t.Id);
            Property(t => t.Id).HasDatabaseGeneratedOption(DatabaseGeneratedOption.Identity);

	        HasRequired(t => t.User)
		        .WithMany()
		        .HasForeignKey(t => t.UserId);

            this.HasIndex("UX_Anonymous_TokenHash", IndexOptions.Unique, e => e.Property(t => t.TokenHash));
        }
    }
}