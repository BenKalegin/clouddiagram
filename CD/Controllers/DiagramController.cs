using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web;
using System.Web.Http;
using CloudDiagram.Web.Models;
using CloudDiagram.Web.Services;
using Newtonsoft.Json;

namespace CloudDiagram.Web.Controllers
{
    public class DiagramController : ApiController
    {
        // GET: api/Diagram
        public IEnumerable<MindMapDto> Get()
        {
            return new MindMapDto[0];
        }

        // GET: api/Diagram/5
        public MindMapDto Get(string id)
        {
            var result = new DiagramServices().GetById(id);
            if (result == null)
            {
                throw new HttpResponseException(new HttpResponseMessage(HttpStatusCode.NotFound)
                {
                    Content = new StringContent(string.Format("Diagram with id = {0} not found", id)),
                    ReasonPhrase = "Diagram ID Not Found"
                });
            }

            return result;
        }

        // POST: api/Diagram
        public void Post(MindMapDto dto)
        {
            var anonymousId = HttpContext.Current.Request.AnonymousID;
            new DiagramServices().CreateNewDiagram(anonymousId, dto);
        }

        // PUT: api/Diagram/5
        public void Put(int id, MindMapDto value)
        {
        }

        // DELETE: api/Diagram/5
        public void Delete(int id)
        {
        }
    }
}
