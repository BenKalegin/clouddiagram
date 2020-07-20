using System.Web.Mvc;
using System.Web;

namespace CloudDiagram.Web.Controllers
{
    [RequireHttps]
    public class HomeController : Controller
    {
        // GET: Home
        public ActionResult Index()
        {
	        var id = Request.AnonymousID;
            return View();
        }
    }
}