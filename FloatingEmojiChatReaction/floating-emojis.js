const chatEl = document.querySelector('.tab-pane#public-chat > livelike-chat');

function createFloatingReaction(src) {
  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

  const container = chatEl.firstElementChild;
  console.log('container', container);
  const containerWidth = container.offsetWidth;
  const startingWidth = rand(containerWidth * 0.3, containerWidth * 0.7);
  const timeout = rand(5, 10);
  const left = (startingWidth / container.offsetWidth) * 100;
  const img = document.createElement('img');
  img.src = src;
  img.setAttribute('class', 'floater');
  img.style.display = 'block';
  img.style.left = left + '%';
  img.style.animationDuration = timeout + 's';

  container.appendChild(img);
  setTimeout(() => img.remove(), timeout * 1000);
}
chatEl.addEventListener('reactionadded', function (e) {
  console.log('e', e);
  let reactionId = e.detail.message.value;
  let reaction = this.reactionPack.find((r) => r.id === reactionId);
  createFloatingReaction(reaction.file);
});
