
/* The model */

function Todo(db) {

   db = db || DB("todo-riot");

   var self = $.observable(this),
      items = db.get();

   self.add = function(name) {
      var item = { id: "_" + ("" + Math.random()).slice(2), name: name }
      items[item.id] = item;
      self.emit("add", item);
   }

   self.edit = function(item) {
      items[item.id] = item;
      self.emit("edit", item);
   }

   self.remove = function(filter) {
      var els = self.items(filter);
      $.each(els, function() {
         delete items[this.id]
      })
      self.emit("remove", els);
   }

   self.toggle = function(id) {
      var item = items[id];
      item.done = !item.done;
      self.emit("toggle", item);
   }

   // @param filter: <empty>, id, "active", "completed"
   self.items = function(filter) {
      var ret = [];
      $.each(items, function(id, item) {
         if (!filter || filter == id || filter == (item.done ? "completed" : "active")) ret.push(item)
      })
      return ret;
   }

   // sync database
   self.on("add remove toggle edit", function() {
      db.put(items);
   })

}

/* The presenter */

(function() { 'use strict';
   /*
      A Model instance. Exposed to global space so it can be used
      on the browser's console. Try for example:

      todo.add("My task");
   */
   window.todo = new Todo();

   // HTML for a sintle todo item
   var template = $("[type='html/todo']").html(),
      root = $("#todo-list"),
      nav = $("#filters a");

   /* Listen to user events */

   $("#new-todo").keyup(function(e) {
      var val = $.trim(this.value);
      if (e.which == 13 && val) {
         todo.add(val);
         this.value = "";
      }
   })

   $("#toggle-all").click(function() {
      $("li", root).each(function() {
         todo.toggle(this.id);
      })
   })

   $("#clear-completed").click(function() {
      todo.remove("completed");
   })

   /* Listen to model events */

   todo.on("add", add).on("remove", function(items) {
      $.each(items, function() {
         $("#" + this.id).remove()
      })

   }).on("toggle", function(item) {
      toggle($("#" + item.id), !!item.done)

   }).on("edit", function(item) {
      var el = $(item.id);
      el.removeClass("editing");
      $("label, .edit", el).text(item.name).val(item.name);

   // counts
   }).on("add remove toggle", counts)

   // routing
   nav.click(function() {
      return $.route($(this).attr("href"))
   })

   $.route(function(hash) {

      // clear list and add new ones
      root.empty() && $.each(todo.items(hash.slice(2)), add)

      // selected class
      nav.removeClass("selected").filter("[href='" + hash + "']").addClass("selected");

      // update counts
      counts()
   })

   // private functions
   function toggle(el, flag) {
      el.toggleClass("completed", flag);
      $(":checkbox", el).prop("checked", flag);
   }

   function add(item) {
      if (this.id) item = this;

      var el = $.el(template, item).appendTo(root),
         input = $(".edit", el);

      $(".toggle", el).click(function() {
         todo.toggle(item.id);
      })

      toggle(el, !!item.done);

      // edit
      input.keydown(function(e) {
         var val = $.trim(this.value);
         if (e.which == 13 && val) {
            item.name = val;
            todo.edit(item);
         }
      })

      $("label", el).dblclick(function() {
         el.addClass("editing");
         input.focus()[0].select();
      })

      // remove
      $(".destroy", el).click(function() {
         todo.remove(item.id);
      })

   }

   function counts() {
      var active = todo.items("active").length,
          done = todo.items("completed").length;

      $("#todo-count").html("<strong>" +active+ "</strong> item" +(active == 1 ? "" : "s")+ " left")
      $("#clear-completed").toggle(done > 0).text("Clear completed (" + done + ")")
      $("#footer").toggle(active + done > 0)
   }

})()


function DB(key) {
   var store = window.localStorage;

   return {
      get: function() {
         return JSON.parse(store[key] || '{}')
      },

      put: function(data) {
         store[key] = JSON.stringify(data)
      }
   }
}