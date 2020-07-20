using Microsoft.AspNet.Identity.EntityFramework;

namespace CloudDiagram.Web.EF.Models
{
    public class Role : IdentityRole<int, UserRole>
    {
        public Role() { }
        public Role(string name) { Name = name; }
    }
}