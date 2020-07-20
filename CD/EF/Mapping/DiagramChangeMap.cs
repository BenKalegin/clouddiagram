using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Data.Entity.ModelConfiguration;
using System.Linq;
using System.Web;
using CloudDiagram.Web.EF.Models;

namespace CloudDiagram.Web.EF.Mapping
{
	public class DiagramChangeMap : EntityTypeConfiguration<DiagramChange>
	{
		public DiagramChangeMap()
		{
			HasKey(t => t.Id);
			Property(t => t.Id).HasDatabaseGeneratedOption(DatabaseGeneratedOption.Identity);

			HasRequired(t => t.ChangedBy)
				.WithMany(t => t.Changes)
				.HasForeignKey(t => t.ChangedById).WillCascadeOnDelete(false);

			HasRequired(t => t.Diagram)
				.WithMany()
				.HasForeignKey(t => t.DiagramId);
		}
	}
}