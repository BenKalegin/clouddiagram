using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace CloudDiagram.Web.EF.Models
{
    public class Workgroup
    {
        [Key]
        public int Id { get; set; }
        public int AccountId { get; set; }
        public virtual Account Account { get; set; }
        public virtual IList<User> Users { get; set; }
        public virtual IList<Diagram> Diagrams { get; set; }
    }
}