using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace CloudDiagram.Web.EF.Models
{
    public class Account
    {
        public int Id { get; set; }

        [MaxLength(80)]
        public string Name { get; set; }

        public virtual IList<Workgroup> Workgroups { get; set; }
    }
}