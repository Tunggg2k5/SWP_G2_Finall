import { getCollection, isObjectId, toObjectId } from "../config/mongodb.js";
import { RELATION_COLLECTIONS } from "../models/collections.js";

export function normalizeIdFields(filter = {}, fields = []) {
  const normalized = { ...filter };
  for (const field of fields) {
    if (!(field in normalized)) continue;
    const value = normalized[field];
    if (isObjectId(value)) {
      normalized[field] = toObjectId(value);
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      normalized[field] = Object.fromEntries(
        Object.entries(value).map(([operator, item]) => [
          operator,
          Array.isArray(item) ? item.map(toObjectId) : toObjectId(item)
        ])
      );
    } else {
      normalized[field] = toObjectId(value);
    }
  }
  return normalized;
}

export function parseProjection(select) {
  if (!select) return undefined;
  if (typeof select === "object") return select;
  const fields = select.split(/\s+/).filter(Boolean);
  const exclusions = fields.filter((field) => field.startsWith("-"));
  if (exclusions.length) {
    return Object.fromEntries(exclusions.map((field) => [field.slice(1), 0]));
  }
  return Object.fromEntries(fields.map((field) => [field, 1]));
}

export async function findMany(collectionName, filter = {}, options = {}) {
  const cursor = getCollection(collectionName).find(filter, {
    projection: parseProjection(options.projection)
  });
  if (options.sort) cursor.sort(options.sort);
  if (options.limit) cursor.limit(options.limit);
  return cursor.toArray();
}

export function findOne(collectionName, filter = {}, projection) {
  return getCollection(collectionName).findOne(filter, {
    projection: parseProjection(projection)
  });
}

export function findById(collectionName, value, projection) {
  return findOne(collectionName, { _id: toObjectId(value) }, projection);
}

export async function insertDocuments(collectionName, input) {
  const now = new Date();
  if (Array.isArray(input)) {
    if (!input.length) return [];
    const documents = input.map((item) => ({ ...item, createdAt: item.createdAt || now, updatedAt: now }));
    const result = await getCollection(collectionName).insertMany(documents);
    return documents.map((document, index) => ({ ...document, _id: result.insertedIds[index] }));
  }

  const document = { ...input, createdAt: input.createdAt || now, updatedAt: now };
  const result = await getCollection(collectionName).insertOne(document);
  return { ...document, _id: result.insertedId };
}

export async function updateOneAndReturn(collectionName, filter, update, options = {}) {
  const updateDocument = Object.keys(update).some((key) => key.startsWith("$"))
    ? { ...update, $set: { ...(update.$set || {}), updatedAt: new Date() } }
    : { $set: { ...update, updatedAt: new Date() } };

  if (options.upsert) {
    updateDocument.$setOnInsert = {
      ...(updateDocument.$setOnInsert || {}),
      createdAt: new Date()
    };
  }

  return getCollection(collectionName).findOneAndUpdate(filter, updateDocument, {
    upsert: options.upsert,
    returnDocument: "after"
  });
}

export function updateById(collectionName, value, update, options = {}) {
  return updateOneAndReturn(collectionName, { _id: toObjectId(value) }, update, options);
}

export function deleteAll(collectionName) {
  return getCollection(collectionName).deleteMany({});
}

export function removeById(collectionName, value) {
  return getCollection(collectionName).findOneAndDelete({ _id: toObjectId(value) });
}

function relationId(value) {
  return value?._id || value;
}

function normalizePopulateSpec(spec) {
  if (typeof spec === "string") return { path: spec };
  return spec;
}

export async function populate(documents, specs) {
  const list = Array.isArray(documents) ? documents : [documents];
  const validDocuments = list.filter(Boolean);
  if (!validDocuments.length) return documents;

  for (const rawSpec of Array.isArray(specs) ? specs : [specs]) {
    const spec = normalizePopulateSpec(rawSpec);
    const collectionName = RELATION_COLLECTIONS[spec.path];
    if (!collectionName) continue;

    const ids = [
      ...new Map(
        validDocuments
          .map((document) => relationId(document[spec.path]))
          .filter(Boolean)
          .map((value) => {
            const id = toObjectId(value);
            return [id.toString(), id];
          })
      ).values()
    ];
    if (!ids.length) continue;

    const related = await findMany(
      collectionName,
      { _id: { $in: ids } },
      { projection: spec.select }
    );
    if (spec.populate) {
      await populate(related, spec.populate);
    }
    const relatedMap = new Map(related.map((item) => [item._id.toString(), item]));

    for (const document of validDocuments) {
      const value = relationId(document[spec.path]);
      if (value) document[spec.path] = relatedMap.get(toObjectId(value).toString()) || null;
    }
  }

  return documents;
}

export function stripPopulatedRelations(document, relationFields = []) {
  const clean = { ...document };
  delete clean._id;
  for (const field of relationFields) {
    if (clean[field]?._id) clean[field] = clean[field]._id;
  }
  return clean;
}
