import { SongModel } from "./SongModel";

export class ProjectModel {
    song: SongModel;

    constructor() {
        this.song = new SongModel();
    }
}
