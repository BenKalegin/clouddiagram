using System.ComponentModel.DataAnnotations;

namespace CloudDiagram.Web.EF.Models
{
    public class Anonymous
    {
        public int Id { get; set; }
		[MaxLength(160)]
		public string Token { get; set; }
		public int TokenHash { get; set; }
        public int UserId { get; set; }
        public virtual User User { get; set; }
    }
}
