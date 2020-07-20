using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CloudDiagram.Web.EF.Models
{
    public class Diagram
    {
        [Key]
        public int Id { get; set; }
        public int WorkgroupId { get; set; }
        public int CreatedById { get; set; }
		/// <summary>
		/// Security by obscurity: We hide Id from public so people cant easily peek other diagrams. 10xbase32, something like f79lha5oj8
		/// </summary>
		[MaxLength(10)]
		public string PublicId { get; set; }
        [Column(TypeName = "xml")]
        public string Content { get; set; } 
        [MaxLength(255)]
        public string Caption { get; set; } 
        public virtual Workgroup Workgroup { get; set; }
        public virtual User CreatedBy { get; set; }
    }
}