using System.Linq;
using CloudDiagram.Web.EF;

namespace CloudDiagram.Web.Services
{
    public class UserServices
    {
        public string GetMostRecentlyOpenedDiagram(string anonymousId)
        {
            using (var db = new CloudDiagramContext())
            {
                var anon = db.AnonymousByToken(anonymousId);
	            if (anon == null)
					return null;

	            var lastVisitedPublicId = anon.User.Visits.OrderByDescending(v => v.Id).Select(v => v.Diagram.PublicId).FirstOrDefault();
	            return lastVisitedPublicId;
            }
        }
    }
}