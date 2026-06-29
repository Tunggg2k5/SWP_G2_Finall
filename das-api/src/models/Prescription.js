import mongoose from "mongoose";

const prescriptionSchema = new mongoose.Schema({
  treatmentRecord: { type: mongoose.Schema.Types.ObjectId, ref: "treatmentrecords" },
  medicines: [mongoose.Schema.Types.Mixed],
  note: String
}, {
  timestamps: true,
  collection: "prescriptions",
  strict: false,
  versionKey: false
});

export default mongoose.models.prescriptions || mongoose.model("prescriptions", prescriptionSchema);
