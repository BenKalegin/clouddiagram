namespace CloudDiagram.Web.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class Initial : DbMigration
    {
        public override void Up()
        {
            CreateTable(
                "dbo.Accounts",
                c => new
                    {
                        Id = c.Int(nullable: false, identity: true),
                        Name = c.String(maxLength: 80),
                    })
                .PrimaryKey(t => t.Id);
            
            CreateTable(
                "dbo.Workgroups",
                c => new
                    {
                        Id = c.Int(nullable: false, identity: true),
                        AccountId = c.Int(nullable: false),
                    })
                .PrimaryKey(t => t.Id)
                .ForeignKey("dbo.Accounts", t => t.AccountId, cascadeDelete: true)
                .Index(t => t.AccountId);
            
            CreateTable(
                "dbo.Diagrams",
                c => new
                    {
                        Id = c.Int(nullable: false, identity: true),
                        WorkgroupId = c.Int(nullable: false),
                        CreatedById = c.Int(nullable: false),
                        PublicId = c.String(maxLength: 10),
                    })
                .PrimaryKey(t => t.Id)
                .ForeignKey("dbo.Users", t => t.CreatedById, cascadeDelete: true)
                .ForeignKey("dbo.Workgroups", t => t.WorkgroupId, cascadeDelete: true)
                .Index(t => t.WorkgroupId)
                .Index(t => t.CreatedById)
                .Index(t => t.PublicId, unique: true, name: "UX_Diagram_PublicId");
            
            CreateTable(
                "dbo.Users",
                c => new
                    {
                        Id = c.Int(nullable: false, identity: true),
                        AccountId = c.Int(),
                    })
                .PrimaryKey(t => t.Id)
                .ForeignKey("dbo.Accounts", t => t.AccountId)
                .Index(t => t.AccountId);
            
            CreateTable(
                "dbo.DiagramChanges",
                c => new
                    {
                        Id = c.Int(nullable: false, identity: true),
                        When = c.DateTime(nullable: false),
                        VersionBefore = c.Int(nullable: false),
                        VersionAfter = c.Int(nullable: false),
                        DiagramId = c.Int(nullable: false),
                        ChangedById = c.Int(nullable: false),
                    })
                .PrimaryKey(t => t.Id)
                .ForeignKey("dbo.Users", t => t.ChangedById)
                .ForeignKey("dbo.Diagrams", t => t.DiagramId, cascadeDelete: true)
                .Index(t => t.DiagramId)
                .Index(t => t.ChangedById);
            
            CreateTable(
                "dbo.DiagramVisits",
                c => new
                    {
                        Id = c.Int(nullable: false, identity: true),
                        When = c.DateTime(nullable: false),
                        Version = c.Int(nullable: false),
                        DiagramId = c.Int(nullable: false),
                        VisitedById = c.Int(nullable: false),
                    })
                .PrimaryKey(t => t.Id)
                .ForeignKey("dbo.Diagrams", t => t.DiagramId, cascadeDelete: true)
                .ForeignKey("dbo.Users", t => t.VisitedById)
                .Index(t => t.DiagramId)
                .Index(t => t.VisitedById);
            
            CreateTable(
                "dbo.Anonymous",
                c => new
                    {
                        Id = c.Int(nullable: false, identity: true),
                        Token = c.String(maxLength: 160),
                        TokenHash = c.Int(nullable: false),
                        UserId = c.Int(nullable: false),
                    })
                .PrimaryKey(t => t.Id)
                .ForeignKey("dbo.Users", t => t.UserId, cascadeDelete: true)
                .Index(t => t.TokenHash, unique: true, name: "UX_Anonymous_TokenHash")
                .Index(t => t.UserId);
            
            CreateTable(
                "dbo.WorkgroupUsers",
                c => new
                    {
                        UserId = c.Int(nullable: false),
                        WorkgroupId = c.Int(nullable: false),
                    })
                .PrimaryKey(t => new { t.UserId, t.WorkgroupId })
                .ForeignKey("dbo.Users", t => t.UserId, cascadeDelete: true)
                .ForeignKey("dbo.Workgroups", t => t.WorkgroupId, cascadeDelete: true)
                .Index(t => t.UserId)
                .Index(t => t.WorkgroupId);
            
        }
        
        public override void Down()
        {
            DropForeignKey("dbo.Anonymous", "UserId", "dbo.Users");
            DropForeignKey("dbo.Diagrams", "WorkgroupId", "dbo.Workgroups");
            DropForeignKey("dbo.Diagrams", "CreatedById", "dbo.Users");
            DropForeignKey("dbo.WorkgroupUsers", "WorkgroupId", "dbo.Workgroups");
            DropForeignKey("dbo.WorkgroupUsers", "UserId", "dbo.Users");
            DropForeignKey("dbo.DiagramVisits", "VisitedById", "dbo.Users");
            DropForeignKey("dbo.DiagramVisits", "DiagramId", "dbo.Diagrams");
            DropForeignKey("dbo.DiagramChanges", "DiagramId", "dbo.Diagrams");
            DropForeignKey("dbo.DiagramChanges", "ChangedById", "dbo.Users");
            DropForeignKey("dbo.Users", "AccountId", "dbo.Accounts");
            DropForeignKey("dbo.Workgroups", "AccountId", "dbo.Accounts");
            DropIndex("dbo.WorkgroupUsers", new[] { "WorkgroupId" });
            DropIndex("dbo.WorkgroupUsers", new[] { "UserId" });
            DropIndex("dbo.Anonymous", new[] { "UserId" });
            DropIndex("dbo.Anonymous", "UX_Anonymous_TokenHash");
            DropIndex("dbo.DiagramVisits", new[] { "VisitedById" });
            DropIndex("dbo.DiagramVisits", new[] { "DiagramId" });
            DropIndex("dbo.DiagramChanges", new[] { "ChangedById" });
            DropIndex("dbo.DiagramChanges", new[] { "DiagramId" });
            DropIndex("dbo.Users", new[] { "AccountId" });
            DropIndex("dbo.Diagrams", "UX_Diagram_PublicId");
            DropIndex("dbo.Diagrams", new[] { "CreatedById" });
            DropIndex("dbo.Diagrams", new[] { "WorkgroupId" });
            DropIndex("dbo.Workgroups", new[] { "AccountId" });
            DropTable("dbo.WorkgroupUsers");
            DropTable("dbo.Anonymous");
            DropTable("dbo.DiagramVisits");
            DropTable("dbo.DiagramChanges");
            DropTable("dbo.Users");
            DropTable("dbo.Diagrams");
            DropTable("dbo.Workgroups");
            DropTable("dbo.Accounts");
        }
    }
}
