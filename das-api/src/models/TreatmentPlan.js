import mongoose from "mongoose";

const treatmentPlanSchema = new mongoose.Schema({
  treatmentRecord: { type: mongoose.Schema.Types.ObjectId, ref: "treatmentrecords" },
  dentist: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  planDetail: String,
  estimatedCost: Number,
  status: String
}, {
  timestamps: true,
  collection: "treatmentplans",
  strict: false,
  versionKey: false
});

export default mongoose.models.treatmentplans || mongoose.model("treatmentplans", treatmentPlanSchema);
