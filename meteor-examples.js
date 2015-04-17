function getNavigationItems(onlyVisible) {

    var navigationItems = [
        {name: "dashboard", template: "dashboard", title: "Dashboard", path: "/", isVisible: false},
        {name: "scheduler", template: "scheduler", title: "Scheduler", path: "/scheduler", parent: "dashboard"},
        {name: "gantt", template: "gantt", title: "Gantt", path: "/gantt", parent: "dashboard"}
    ];

    if(!onlyVisible)
        return navigationItems;

    var visibleItems = [];
    for(var key in navigationItems) {
        var item = navigationItems[key];
        if(!item.hasOwnProperty("isVisible") || item.isVisible)
            visibleItems.push(item);
    }

    return visibleItems;
}

Router.map(function() {
    var navigationItems = getNavigationItems();
    for(var key in navigationItems) {
        var item = navigationItems[key];
        this.route(item.path, item);
    }
});

var SchedulerTasks = new Mongo.Collection("SchedulerTasks"),
    GanttTasks = new Mongo.Collection("GanttTasks"),
    GanttLinks = new Mongo.Collection("GanttLinks");

if(Meteor.isServer) {
    Meteor.startup(function () {
        Meteor.methods({
            getCollectionsStates: function() {
                return {
                    SchedulerTasks: {isEmpty: !SchedulerTasks.find().count()},
                    GanttTasks: {data: GanttTasks.find().fetch(), isEmpty: !GanttTasks.find().count()}
                };
            }
        });
    });
}

if(Meteor.isClient) {
    Meteor.startup(function () {
        Meteor.call("getCollectionsStates", function(error, data) {
            if(data.SchedulerTasks.isEmpty)
                scheduler.parse(Data.scheduler, "json");

            if(data.GanttTasks.isEmpty)
                gantt.parse(Data.gantt, "json");
        });

        Template.dashboard.helpers({
            navigationItems: getNavigationItems(true)
        });

        Template.scheduler.onRendered(function() {
            scheduler.config.xml_date = "%Y-%m-%d %H:%i";
            scheduler.config.prevent_cache = true;
            scheduler.xy.margin_top = 30;
            scheduler.init("scheduler_here", new Date(2015, 0, 20), "month");
            scheduler.meteor(SchedulerTasks);

        });

        Template.scheduler.onDestroyed(function() {
            scheduler.meteorStop();
        });

        Template.gantt.onRendered(function() {
            gantt.init("gantt_here");
            gantt.meteor({tasks: GanttTasks, links: GanttLinks});
        });

        Template.gantt.onDestroyed(function() {
            gantt.meteorStop();
        });

    });
}