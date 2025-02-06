/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("60liysadyyc301k")

  // remove
  collection.schema.removeField("9bpmqr2c")

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "32oxlqel",
    "name": "days_open",
    "type": "text",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "min": null,
      "max": null,
      "pattern": ""
    }
  }))

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("60liysadyyc301k")

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "9bpmqr2c",
    "name": "days_open",
    "type": "date",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "min": "",
      "max": ""
    }
  }))

  // remove
  collection.schema.removeField("32oxlqel")

  return dao.saveCollection(collection)
})
