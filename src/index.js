let viewIframe = null;
let initDone = false;
let serverName;
let autoEntryIds = [];
let lastAutoEntryId;

/**
 * @param customServer  {string|null}
 */
export function init(customServer = null) {
    const iframeIdName = 'me-recommend';

    if (null !== customServer) {
        serverName = customServer;
    }

    if (null === document.getElementById(iframeIdName)) {
        let iframe = document.createElement('iframe');
        iframe.id = iframeIdName;
        iframe.src = serverName + 'iframe';
        iframe.style.setProperty('display', 'none', 'important');
        document.body.appendChild(iframe);

        iframe.onload = function () {
            iframe.setAttribute('frame-load', '1');
        };
    }

    viewIframe = document.getElementById(iframeIdName);
    initDone = true;
    initEmail();
}

export function initEmail() {
    for (let form of document.forms) {
        for (let element of form.elements) {
            if (element.getAttribute('type') === 'email') {
                form.addEventListener('submit', function () {
                    let email = undefined !== element.value ? element.value : null;

                    if (
                        null === email
                        || (email && email.trim().length === 0)
                    ) {
                        return;
                    }

                    if (initDone === false) {
                        init();
                    }

                    let data = {
                        iframeAction: 'email',
                        email: email.trim(),
                    };
                    sendData(
                        viewIframe,
                        data,
                        serverName + 'saveMeta'
                    );
                }, false);
            }
        }
    }
}

/**
 * @param customTitle        {string|null}
 * @param customDescription  {string|null}
 */
export function startRecommend(
    customTitle = null,
    customDescription = null
) {
    if (initDone === false) {
        init();
    }

    let data = {
        iframeAction: 'store',
        title: getTittle(customTitle),
        description: getDescription(customDescription),
        url: getUri(),
    };
    sendData(
        viewIframe,
        data,
        serverName
    );
}

/**
 * @param projectId  {number}
 */
export function sendAutoEntries(projectId) {
    let jsonLdList = document.querySelectorAll('script[type="application/ld+json"]');

    for (let jsonLdElement of jsonLdList) {
        sendAutoEntry(jsonLdElement, projectId);
    }
}

/**
 * @param jsonLdElement  {Object}
 * @param projectId      {number}
 */
export function sendAutoEntry(jsonLdElement, projectId) {
    let data = new FormData();
    data.append('autoEntryBody', jsonLdElement.innerText);
    data.append('projectId', projectId.toString());
    data.append('url', getUri());

    let xhr = new XMLHttpRequest();
    xhr.open('POST', serverName + 'auto-entry');
    xhr.onload = function () {
        let responseArray = JSON.parse(xhr.responseText);

        if (responseArray['entryId']) {
            let entryId = parseInt(responseArray['entryId'], 10);
            sendClickAction(entryId, projectId); // TODO: must be sendViewAction() in future
            lastAutoEntryId = entryId;
            autoEntryIds[entryId] = entryId;
        }
    }
    xhr.send(data);
}

/**
 * @param projectId  {number}
 */
export function sendAutoConversion(projectId) {
    sendConversionAction(lastAutoEntryId, projectId);
}

/**
 * @param entryJson          {string}
 * @param uniqueEntryId      {number}
 * @param projectId          {number}
 * @param customTitle        {string|null}
 * @param customDescription  {string|null}
 * @param customImageUrl     {string|null}
 * @param customUrl          {string|null}
 */
export function sendCustomEntry(
    entryJson,
    uniqueEntryId,
    projectId,
    customTitle = null,
    customDescription = null,
    customImageUrl = null,
    customUrl = null
) {
    let data = new FormData();
    data.append('customEntryBody', entryJson);
    data.append('projectId', projectId.toString());
    data.append('customTitle', customTitle);
    data.append('customDescription', customDescription);
    data.append('customImageUrl', customImageUrl);
    data.append('customUrl', customUrl);
    data.append('uniqueEntryId', uniqueEntryId.toString());

    let xhr = new XMLHttpRequest();
    xhr.open('POST', serverName + 'custom-entry');
    xhr.send(data);
}

/**
 * @param uniqueEntryId      {number}
 * @param projectId          {number}
 * @param customTitle        {string|null}
 * @param customDescription  {string|null}
 * @param url                {string|null}
 * @param userHistoryId      {string|null}
 */
export function sendViewAction(
    uniqueEntryId,
    projectId,
    customTitle = null,
    customDescription = null,
    url = null,
    userHistoryId = null
) {
    sendAction(1, uniqueEntryId, projectId, customTitle, customDescription, url, userHistoryId);
}

/**
 * @param uniqueEntryId      {number}
 * @param projectId          {number}
 * @param customTitle        {string|null}
 * @param customDescription  {string|null}
 * @param url                {string|null}
 * @param userHistoryId      {string|null}
 */
export function sendClickAction(
    uniqueEntryId,
    projectId,
    customTitle = null,
    customDescription = null,
    url = null,
    userHistoryId = null
) {
    sendAction(2, uniqueEntryId, projectId, customTitle, customDescription, url, userHistoryId);
}

/**
 * @param uniqueEntryId      {number}
 * @param projectId          {number}
 * @param customTitle        {string|null}
 * @param customDescription  {string|null}
 * @param url                {string|null}
 * @param userHistoryId      {string|null}
 */
export function sendConversionAction(
    uniqueEntryId,
    projectId,
    customTitle = null,
    customDescription = null,
    url = null,
    userHistoryId = null
) {
    sendAction(3, uniqueEntryId, projectId, customTitle, customDescription, url, userHistoryId);
}

/**
 * @param action             {number}
 * @param uniqueEntryId      {number}
 * @param projectId          {number}
 * @param customTitle        {string|null}
 * @param customDescription  {string|null}
 * @param url                {string|null}
 * @param userHistoryId      {string|null}
 *
 * @private
 */
function sendAction(
    action,
    uniqueEntryId,
    projectId,
    customTitle = null,
    customDescription = null,
    url = null,
    userHistoryId = null
) {
    if (initDone === false) {
        init();
    }

    let clickData = {
        iframeAction: 'action',
        debugUrl: getUri(),
        action: action,
        clientId: uniqueEntryId,
        projectId: projectId,
        title: getTittle(customTitle),
        description: getDescription(customDescription),
        url: getUri(url),
        userHistoryId: userHistoryId,
    };
    sendData(
        viewIframe,
        clickData,
        serverName + 'saveMeta'
    );
}

/**
 * @param iframe  {HTMLIFrameElement}
 * @param data    {Object}
 * @param server  {string}
 *
 * @private
 */
function sendData(iframe, data, server) {
    if (null !== iframe.getAttribute('frame-load')) {
        iframe.contentWindow.postMessage(data, server);
    } else {
        setTimeout(function () {
            sendData(iframe, data, server);
        }, 2);
    }
}

/**
 * @param customTitle  {string|null}
 *
 * @return {string|null}
 * @private
 */
function getTittle(customTitle) {
    if (null !== customTitle) {
        let receivedTitle = customTitle.trim();

        if (receivedTitle.length > 0) {
            return receivedTitle;
        }
    }

    let pageTitle = undefined !== document.title ? document.title : null;

    if (null !== pageTitle) {
        let title = pageTitle.trim();

        return title.length > 0 ? title : null;
    }

    return null;
}

/**
 * @param customDescription  {string|null}
 *
 * @return {string|null}
 * @private
 */
function getDescription(customDescription) {
    if (null !== customDescription) {
        let receivedDescription = customDescription.trim();

        if (receivedDescription.length > 0) {
            return receivedDescription;
        }
    }

    let descriptionElement = document.querySelector('meta[name="description"]');

    if (null !== descriptionElement) {
        let pageDescription = undefined !== descriptionElement.content ? descriptionElement.content : null;

        if (null !== pageDescription) {
            let description = pageDescription.trim();

            return description.length > 0 ? description : null;
        }
    }

    return null;
}

/**
 * @param url  {string|null}
 *
 * @return {string}
 * @private
 */
function getUri(url = null) {
    if (null !== url) {
        let uri = url.trim();

        if (uri.length > 0) {
            return encodeURI(uri);
        }
    }

    return encodeURI(window.location.href);
}