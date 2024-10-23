/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("60liysadyyc301k")

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "tkedhgxv",
    "name": "employees",
    "type": "relation",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "collectionId": "fnugkicwlw52cs3",
      "cascadeDelete": false,
      "minSelect": null,
      "maxSelect": 1,
      "displayFields": null
    }
  }))

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("60liysadyyc301k")

  // remove
  collection.schema.removeField("tkedhgxv")

  return dao.saveCollection(collection)
})
