const dotenv = require("dotenv");
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

dotenv.config({ path: "./config.env" });
const app = express();

const atlas_username = process.env.ATLAS_USERNAME;
const atlas_password = process.env.ATLAS_PASSWORD;

mongoose.set('strictQuery', false);
mongoose.connect(`mongodb+srv://${atlas_username}:${atlas_password}@cluster0.ghm14at.mongodb.net/todoListDB`);
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const todoListSchema = {
  name: String
};

const customListSchema = {
  name: String,
  items: [todoListSchema]
};

const Item = mongoose.model("Item", todoListSchema);
const customList = mongoose.model("customList", customListSchema);

const defaultItems = [new Item({
  name: "Buy food."
}), new Item({
  name: "Cook food."
}), new Item({
  name: "Eat food."
})];


app.get("/", function (req, res) {
  Item.find({}, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      if (result.length === 0) {
        Item.insertMany(defaultItems, (err) => {
          if (err) {
            console.log(err);
          } else {
            console.log("Successfully added the default items!");
          }
        });
        res.redirect("/");
      } else {
        res.render("list", { listTitle: "Today", newListItems: result });
      }
    }
  })
});

app.post("/", function (req, res) {

  const item = req.body.newItem;
  const listName = req.body.list;
  const newItem = new Item({
    name: item
  });
  if (listName === "Today") {
    newItem.save();
    res.redirect("/");
  } else {
    customList.findOne({ name: listName }, (err, response) => {
      if (err) {
        console.log(err);
      } else {
        response.items.push(newItem);
        response.save();
        res.redirect("/" + listName);
      }
    })
  }
});

app.post("/delete", (req, res) => {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  if (listName === "Today") {
    Item.deleteOne({ _id: checkedItemId }, (err) => {
      if (err) {
        console.log(err);
      } else {
        console.log("Successfully deleted the checked item!");
        res.redirect("/");
      }
    });
  } else {
    customList.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } },
      (err, foundList) => {
        if (err) {
          console.log(err);
        } else {
          res.redirect("/" + listName);
        }
      }
    )
  }
});

app.get("/:paramName", (req, res) => {
  const customListName = _.capitalize(req.params.paramName);
  customList.findOne({ name: customListName }, (err, response) => {
    if (!err) {
      if (!response) {
        console.log("Adding new entry...." + customListName);
        const list = new customList({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        res.render("list", { listTitle: response.name, newListItems: response.items });
      }
    }
  });
});

app.get("/about", function (req, res) {
  res.render("about");
});


let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port, function () {
  console.log(`Server started successfully on ${port}.`);
});
