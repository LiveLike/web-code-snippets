function setupVideo(streamUrl) {
  const hls = new Hls({ startPosition: 1 });
  const videoEl = document.querySelector('video');
  const syncStrategy = new window.HlsJsSyncStrategy(hls, videoEl);

  if (streamUrl) {
    syncStrategy.hls.loadSource(streamUrl);
    syncStrategy.hls.attachMedia(videoEl);
    syncStrategy.hls.on(Hls.Events.MANIFEST_PARSED, () => {});
    videoEl.play();
  } else {
    // Fallback Video
    const source = document.createElement('source');
    // source.setAttribute('src', './manchestervid.mp4');
    // source.setAttribute('type', 'video/mp4');
    // videoEl.appendChild(source);
    // videoEl.play();
    syncStrategy.hls.destroy();
  }
}

const setupProfile = (profile) => {
  // Set the input as the current user profile nickname
  const nickname = document.querySelector('#profileNickname');
  nickname.value = profile.nickname;

  const updateNickname = document.querySelector('#updateNickname');
  const updatedMessage = document.querySelector(
    '.request-result-message#profile-res'
  );

  const updateProfile = (options) =>
    LiveLike.updateUserProfile({
      options,
      accessToken: LiveLike.userProfile.access_token,
    });

  const setUpdatedMessage = (type, message, el) => {
    const currentMessageClass = el.className;
    el.className = currentMessageClass + ' ' + type;
    el.innerHTML = message;
  };

  updateNickname.addEventListener('click', () => {
    // If the current input value is not the same as the current user profile nickname, update.
    // When update is successful, show success message. If error, show error message.
    nickname.value !== LiveLike.userProfile.nickname &&
      updateProfile({ nickname: nickname.value })
        .then(() => setUpdatedMessage('success', 'Updated!', updatedMessage))
        .catch(() => setUpdatedMessage('error', 'Error', updatedMessage));
  });

  const setChatElAvatar = (avatarUrl) => {
    if (avatarUrl) {
      const profileAvatar = document.querySelector('#my-profile-image');
      profileAvatar.setAttribute('src', avatarUrl);
      const chats = document.querySelectorAll('livelike-chat');
      chats.forEach((el) => el.setAttribute('avatarurl', avatarUrl));
    }
  };

  // If the is a saved avatar in profile's custom_data, parse it.
  const customData = LiveLike.userProfile.custom_data;
  const parsedCD = customData && JSON.parse(customData);
  const avatarUrl = parsedCD && parsedCD.avatarUrl;
  // Set livelike-chat's `avatarurl` attribute as the saved avatarUrl if it exists.
  setChatElAvatar(avatarUrl);

  const avatars = document.querySelectorAll('#avatarImage');

  const avatarSelectCallback = (e) => {
    // When avatar image is clicked, loop through all, remove the old `selected` attribute
    // and add a new `selected` attribute to the image that was selected.
    avatars.forEach((el) => {
      if (e.target !== el && el.parentElement.getAttribute('selected')) {
        el.parentElement.removeAttribute('selected');
      }
      e.target.parentElement.setAttribute('selected', 'true');
    });
    // Then update the LiveLike user profile with the selected avatar img src
    updateProfile({
      custom_data: JSON.stringify({ avatarUrl: e.target.src }),
    });
    // Then set the livelike-chat's `avatarurl` attribute with the selected img src.
    setChatElAvatar(e.target.src);
  };

  // If there is a saved avatarUrl in the profile's customData, find matching avatar img
  // and set the `selected` attribute. Then attach click listener.
  avatars.forEach((el) => {
    if (avatarUrl && el.src === avatarUrl) {
      el.parentElement.setAttribute('selected', 'true');
    }
    el.addEventListener('click', avatarSelectCallback);
  });
};

function getParams() {
  let params = {},
    base = 'https://cf-blast';
  if (window.location.search) {
    window.location.search.replace(
      /[?&]+([^=&]+)=([^&]*)/gi,
      (m, key, value) => {
        params[key] = value;
      }
    );
  } else {
    params.env = window.location.hostname.split('.')[0].split('-')[1];
  }

  isEndpointValid = () => {
    const url = new URL(params.endpoint);
    const allowedDomains = [
      'cf-blast.livelikecdn.com',
      'cf-blast-iconic.livelikecdn.com',
      'cf-blast-dig.livelikecdn.com',
      'cf-blast-game-changers.livelikecdn.com',
      'localhost',
      '127.0.0.1',
    ];
    return allowedDomains.includes(url.hostname);
  };

  if (params.endpoint && isEndpointValid()) {
    endpoint = params.endpoint;
  } else {
    params.env && (base += '-' + params.env);
    endpoint = `${base}.livelikecdn.com/api/v1/`;
  }

  return { endpoint, programid: params.program };
}

const getLiveLikeData = () => {
  const params = getParams();
  if (params.programid) {
    return fetch(params.endpoint + 'programs/' + params.programid + '/')
      .then((p) => p.json())
      .then((program) => {
        let publicChatId, influencerChatId;
        if (program.default_chat_room && program.default_chat_room.id) {
          publicChatId = program.default_chat_room.id;
        }
        if (program.chat_rooms && program.chat_rooms.length > 0) {
          for (chatRoom of program.chat_rooms) {
            if (publicChatId && influencerChatId) break;
            !publicChatId &&
              chatRoom.content_filter !== 'producer' &&
              (publicChatId = chatRoom.id);
            !influencerChatId &&
              chatRoom.content_filter === 'producer' &&
              (influencerChatId = chatRoom.id);
          }
        }

        return {
          publicChatId,
          influencerChatId,
          programId: program.id,
          endpoint: params.endpoint,
          clientId: program.client_id,
          streamUrl: program.stream_url,
        };
      });
  }
};

function fetchData() {
  getLiveLikeData().then((livelikeData) => {
    const publicChatEl = document.querySelector('livelike-chat[id=public]');
    publicChatEl.roomid = livelikeData.publicChatId;

    LiveLike.init({
      clientId: livelikeData.clientId,
      endpoint: livelikeData.endpoint,
    }).then((profile) => {
      setupVideo(livelikeData.streamUrl);
      setupProfile(profile);
    });
  });
}

document.addEventListener('DOMContentLoaded', function () {
  fetchData();
});
