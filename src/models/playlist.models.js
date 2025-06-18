const { mongoose, Schema } = require("mongoose");

const playlistSchema = new Schema(
  {
    name: {
      type: String,
      requried: true,
    },
    description: {
      type: String,
      requried: true,
    },
    videos: {
      type: Schema.Types.ObjectId,
      ref: "Video",
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

const Playlist = mongoose.model("Playlist", playlistSchema);

module.exports = Playlist;
