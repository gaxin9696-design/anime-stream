export const qs = (selector, scope = document) => scope.querySelector(selector);
export const qsa = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

export const clearElement = (node) => {
  if (!node) {
    return node;
  }

  node.replaceChildren();
  return node;
};

export const createElement = (tagName, options = {}) => {
  const element = document.createElement(tagName);

  if (options.className) {
    element.className = options.className;
  }

  if (options.text !== undefined) {
    element.textContent = options.text;
  }

  if (options.html !== undefined) {
    element.innerHTML = options.html;
  }

  Object.entries(options.attrs ?? {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === false) {
      return;
    }

    if (value === true) {
      element.setAttribute(key, "");
      return;
    }

    element.setAttribute(key, String(value));
  });

  Object.entries(options.dataset ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      element.dataset[key] = String(value);
    }
  });

  if (Array.isArray(options.children)) {
    options.children.filter(Boolean).forEach((child) => {
      element.append(child);
    });
  }

  return element;
};

export const render = (node, children = []) => {
  if (!node) {
    return;
  }

  clearElement(node);
  const collection = Array.isArray(children) ? children : [children];
  collection.filter(Boolean).forEach((child) => node.append(child));
};

export const setStatus = (node, status, message) => {
  if (!node) {
    return;
  }

  node.dataset.status = status;
  node.textContent = message;
};

export const delegate = (scope, eventName, selector, handler) => {
  scope.addEventListener(eventName, (event) => {
    const target = event.target.closest(selector);
    if (target) {
      handler(event, target);
    }
  });
};

export const toggleHidden = (node, hidden = true) => {
  if (node) {
    node.hidden = Boolean(hidden);
  }
};
