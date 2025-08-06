export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
  PATCH: 'PATCH',
  HEAD: 'HEAD',
  OPTIONS: 'OPTIONS'
};

export const REQUEST_TYPES = {
  FOLDER: 'folder',
  REQUEST: 'request'
};

export const createRequest = (id, name, method = 'GET', url = '', parentId = null) => ({
  id,
  name,
  type: REQUEST_TYPES.REQUEST,
  method,
  url,
  headers: [],
  params: [],
  body: {
    type: 'none', // none, json, form-data, x-www-form-urlencoded, raw
    content: ''
  },
  parentId,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

export const createFolder = (id, name, parentId = null) => ({
  id,
  name,
  type: REQUEST_TYPES.FOLDER,
  parentId,
  collapsed: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

export const createWorkspace = (id, name, description = '') => ({
  id,
  name,
  description,
  variables: {},
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

export const createHeader = (key = '', value = '', enabled = true) => ({
  key,
  value,
  enabled
});

export const createParam = (key = '', value = '', enabled = true) => ({
  key,
  value,
  enabled
});