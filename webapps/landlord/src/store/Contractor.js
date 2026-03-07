import { makeAutoObservable } from 'mobx';
import { apiFetcher } from '../utils/fetch';

class Contractor {
  items = [];
  selected = null;

  constructor() {
    makeAutoObservable(this);
  }

  setItems = (items) => (this.items = items);
  setSelected = (contractor) => (this.selected = contractor);

  *fetch() {
    try {
      const response = yield apiFetcher().get('/contractors');
      this.setItems(response.data);
      return { status: 200, data: response.data };
    } catch (err) {
      console.error('Error fetching contractors:', err);
      throw err;
    }
  }

  *fetchOne(contractorId) {
    try {
      const response = yield apiFetcher().get(`/contractors/${contractorId}`);
      const updatedContractor = response.data;
      this.items = this.items.map((c) =>
        c._id === updatedContractor._id ? updatedContractor : c
      );
      if (this.selected?._id === updatedContractor._id) {
        this.setSelected(updatedContractor);
      }
      return { status: 200, data: updatedContractor };
    } catch (err) {
      console.error('Error fetching contractor:', err);
      throw err;
    }
  }

  *create(contractor) {
    try {
      const response = yield apiFetcher().post('/contractors', contractor);
      const createdContractor = response.data;
      this.items = this.items.concat([createdContractor]);
      return { status: 200, data: createdContractor };
    } catch (err) {
      console.error('Error creating contractor:', err);
      throw err;
    }
  }

  *update(contractor) {
    try {
      const response = yield apiFetcher().patch(
        `/contractors/${contractor._id}`,
        contractor
      );
      const updatedContractor = response.data;
      this.items = this.items.map((c) =>
        c._id === updatedContractor._id ? updatedContractor : c
      );
      if (this.selected?._id === updatedContractor._id) {
        this.setSelected(updatedContractor);
      }
      return { status: 200, data: updatedContractor };
    } catch (err) {
      console.error('Error updating contractor:', err);
      throw err;
    }
  }

  *delete(ids) {
    try {
      const response = yield apiFetcher().delete(
        `/contractors/${ids.join(',')}`
      );
      this.items = this.items.filter((c) => !ids.includes(c._id));
      this.setSelected(null);
      return { status: response.status };
    } catch (err) {
      console.error('Error deleting contractor:', err);
      throw err;
    }
  }

  // Work records
  *fetchWork(contractorId) {
    try {
      const response = yield apiFetcher().get(
        `/contractors/${contractorId}/work`
      );
      return { status: 200, data: response.data };
    } catch (err) {
      console.error('Error fetching work records:', err);
      throw err;
    }
  }

  *fetchAllWork(filters = {}) {
    try {
      const response = yield apiFetcher().get('/contractors/work', {
        params: filters
      });
      return { status: 200, data: response.data };
    } catch (err) {
      console.error('Error fetching all work records:', err);
      throw err;
    }
  }

  *createWork(contractorId, work) {
    try {
      const response = yield apiFetcher().post(
        `/contractors/${contractorId}/work`,
        work
      );
      return { status: 201, data: response.data };
    } catch (err) {
      console.error('Error creating work record:', err);
      throw err;
    }
  }

  *updateWork(workId, work) {
    try {
      const response = yield apiFetcher().patch(
        `/contractors/work/${workId}`,
        work
      );
      return { status: 200, data: response.data };
    } catch (err) {
      console.error('Error updating work record:', err);
      throw err;
    }
  }

  *deleteWork(workId) {
    try {
      const response = yield apiFetcher().delete(`/contractors/work/${workId}`);
      return { status: response.status };
    } catch (err) {
      console.error('Error deleting work record:', err);
      throw err;
    }
  }
}

export default Contractor;
