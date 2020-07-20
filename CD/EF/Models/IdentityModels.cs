using Microsoft.AspNet.Identity.EntityFramework;

namespace CloudDiagram.Web.EF.Models
{
    public class UserClaim : IdentityUserClaim<int> { }

    public class UserStore : UserStore<User, Role, int,
        UserLogin, UserRole, UserClaim>
    {
        public UserStore(CloudDiagramContext context)
            : base(context)
        {
        }
    }

    public class RoleStore : RoleStore<Role, int, UserRole>
    {
        public RoleStore(CloudDiagramContext context)
            : base(context)
        {
        }
    }
}