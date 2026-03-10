import { apiFetcher } from '../utils/fetch';
import { makeAutoObservable } from 'mobx';

class Project {
  items = [];
  selected = null;

  constructor() {
    makeAutoObservable(this);
  }

  setItems = (items) => (this.items = items);
  setSelected = (project) => (this.selected = project);

  *fetch() {
    try {
      const response = yield apiFetcher().get('/projects');
      this.setItems(response.data);
      return { status: 200, data: response.data };
    } catch (err) {
      console.error('Error fetching projects:', err);
      throw err;
    }
  }

  *fetchOne(projectId) {
    try {
      const response = yield apiFetcher().get(`/projects/${projectId}`);
      const updatedProject = response.data;
      this.items = this.items.map((p) =>
        p._id === updatedProject._id ? updatedProject : p
      );
      this.setSelected(updatedProject);
      return { status: 200, data: updatedProject };
    } catch (err) {
      console.error('Error fetching project:', err);
      throw err;
    }
  }

  *create(project) {
    try {
      const response = yield apiFetcher().post('/projects', project);
      const createdProject = response.data;
      this.items = this.items.concat([createdProject]);
      return { status: 200, data: createdProject };
    } catch (err) {
      console.error('Error creating project:', err);
      throw err;
    }
  }

  *update(project) {
    try {
      const response = yield apiFetcher().patch(
        `/projects/${project._id}`,
        project
      );
      const updatedProject = response.data;
      this.items = this.items.map((p) =>
        p._id === updatedProject._id ? updatedProject : p
      );
      if (this.selected?._id === updatedProject._id) {
        this.setSelected(updatedProject);
      }
      return { status: 200, data: updatedProject };
    } catch (err) {
      console.error('Error updating project:', err);
      throw err;
    }
  }

  *delete(ids) {
    try {
      const response = yield apiFetcher().delete(`/projects/${ids.join(',')}`);
      this.items = this.items.filter((p) => !ids.includes(p._id));
      this.setSelected(null);
      return { status: response.status };
    } catch (err) {
      console.error('Error deleting project:', err);
      throw err;
    }
  }
}

export default Project;
