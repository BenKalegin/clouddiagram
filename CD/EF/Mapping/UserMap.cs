using System.ComponentModel.DataAnnotations.Schema;
using System.Data.Entity.ModelConfiguration;
using CloudDiagram.Web.EF.Models;

namespace CloudDiagram.Web.EF.Mapping
{
    public class UserMap : EntityTypeConfiguration<User>
    {
        public UserMap()
        {
            HasKey(t => t.Id);
            Property(t => t.Id).HasDatabaseGeneratedOption(DatabaseGeneratedOption.Identity);

            // Properties
            // Table & Column Mappings
	        HasOptional(t => t.Account)
		        .WithMany()
		        .HasForeignKey(t => t.AccountId);

            HasMany(t => t.Workgroups)
                .WithMany(t => t.Users)
                .Map(m =>
                {
                    m.ToTable("WorkgroupUsers");
                    m.MapLeftKey("UserId");
                    m.MapRightKey("WorkgroupId");
                });
        }
    }
}