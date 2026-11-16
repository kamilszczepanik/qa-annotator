const CAPTURING_LABEL = "Capturing…";

const createThumbnail = ({ number, thumbnail }) => {
  const figure = document.createElement("figure");
  figure.className = "area-shot";
  if (thumbnail) {
    const image = document.createElement("img");
    image.src = thumbnail;
    image.alt = `Area ${number} on the page`;
    figure.append(image);
  } else {
    const placeholder = document.createElement("span");
    placeholder.className = "area-shot-placeholder";
    placeholder.textContent = CAPTURING_LABEL;
    figure.append(placeholder);
  }
  const badge = document.createElement("span");
  badge.className = "area-number";
  badge.textContent = String(number);
  figure.append(badge);
  return figure;
};

const createArea = ({ number, comment, thumbnail }) => {
  const item = document.createElement("li");
  item.className = "area";
  const text = document.createElement("p");
  text.className = "area-comment";
  text.textContent = comment;
  item.append(createThumbnail({ number, thumbnail }), text);
  return item;
};

export const renderAreas = ({ list, areas }) => {
  const signature = JSON.stringify(areas);
  if (list.dataset.signature !== signature) {
    list.dataset.signature = signature;
    list.replaceChildren(...areas.map(createArea));
  }
  list.hidden = areas.length === 0;
};
