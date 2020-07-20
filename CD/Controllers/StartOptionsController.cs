using System;
using System.Web;
using System.Web.Http;
using CloudDiagram.Web.Models;
using CloudDiagram.Web.Services;

namespace CloudDiagram.Web.Controllers
{
    public class StartOptionsController : ApiController
    {
	    public StartOptions[] GetAllStartOptions()
	    {
			var services = new UserServices();
		    var anonymousId = HttpContext.Current.Request.AnonymousID;

		    return new[] {
				new StartOptions {
					LastDiagram = services.GetMostRecentlyOpenedDiagram(anonymousId)
				}
			};
	    }
    }
}
