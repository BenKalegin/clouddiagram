namespace CloudDiagram.Web.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class xmldiagram : DbMigration
    {
        public override void Up()
        {
            AddColumn("dbo.Diagrams", "Content", c => c.String(storeType: "xml"));
            AddColumn("dbo.Diagrams", "Caption", c => c.String(maxLength: 255));
        }
        
        public override void Down()
        {
            DropColumn("dbo.Diagrams", "Caption");
            DropColumn("dbo.Diagrams", "Content");
        }
    }
}
