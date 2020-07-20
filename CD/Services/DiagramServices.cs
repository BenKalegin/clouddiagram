using System;
using System.Linq;
using System.Net;
using System.Web.Http;
using CloudDiagram.Web.EF;
using CloudDiagram.Web.EF.Models;
using CloudDiagram.Web.Models;
using User = CloudDiagram.Web.EF.Models.User;

namespace CloudDiagram.Web.Services
{
    public class DiagramServices
    {
        public void CreateNewDiagram(string anonymousId, object model)
        {
            using (var db = new CloudDiagramContext())
            {
                var anon = db.AnonymousByToken(anonymousId);
                User user;
                Workgroup workgroup;
                if (anon == null)
                {
                    var account = new Account();
                    db.Accounts.Add(account);

                    user = new User
                    {
                        Account = account
                    };
                    db.Users.Add(user);

                    workgroup = new Workgroup
                    {
                        Account = account,
                        Users = new[] {user}
                    };
                    db.Workgroups.Add(workgroup);

                    anon = new Anonymous {Token = anonymousId, TokenHash = anonymousId.GetHashCode(), User = user};
                    db.Anonymouses.Add(anon);
                }
                else
                {
                    user = anon.User;
                    workgroup = user.Workgroups.First();
                }

                var diagram = new Diagram
                {
                    CreatedBy = user,
                    PublicId = db.GeneratePublicId(),
                    Workgroup = workgroup,
                    Content = XmlMarshal.WriteContext(model)
                };
                db.Diagrams.Add(diagram);

                db.DiagramVisits.Add(new DiagramVisit
                {
                    Diagram = diagram,
                    VisitedBy = user,
                    When = DateTime.UtcNow,
                    Version = 1
                });

                db.DiagramChanges.Add(new DiagramChange
                {
                    Diagram = diagram,
                    ChangedBy = user,
                    When = DateTime.UtcNow,
                    VersionBefore = 0,
                    VersionAfter = 1
                });
                db.SaveChanges();
            }
        }

        public MindMapDto GetById(string id)
        {
            using (var db = new CloudDiagramContext())
            {
                var diagram = db.Diagrams.SingleOrDefault(d => d.PublicId == id);
                if (diagram != null)
                    return XmlMarshal.ReadContext<MindMapDto>(diagram.Content);
                return null;
            }
        }
    }
}