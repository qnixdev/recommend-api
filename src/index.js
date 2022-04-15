let viewIframe = null;
let initDone = false;
let autoEntryIds = [];
let iframeIdName = 'me-recommend';
let server;
let lastAutoEntryId;

/**
 * @param customServer  {string}
 */
export function initEmail(customServer) {
    for (let form of document.forms) {
        for (let element of form.elements) {
            if (element.getAttribute('type') === 'email') {
                form.addEventListener('submit', () => {
                    if (element) {
                        if (initDone === false) {
                            init(customServer);
                        }

                        let clickData = {
                            iframeAction: 'email',
                            email: element.value
                        };
                        sendData(
                            viewIframe,
                            clickData,
                            server + 'saveMeta'
                        );
                    }
                }, false);
            }
        }
    }
}

/**
 * @param customServer  {string}
 */
export function init(customServer) {
    initDone = true;
    server = customServer;

    if (null === document.getElementById(iframeIdName)) {
        let iframe = document.createElement('iframe');
        iframe.id = iframeIdName;
        iframe.src = customServer + 'iframe';
        iframe.style.setProperty('display', 'none', 'important');
        document.body.appendChild(iframe);

        iframe.onload = function () {
            iframe.setAttribute('frame-load', '1');
        };
    }

    viewIframe = document.getElementById(iframeIdName);
    initEmail(customServer);
}

/**
 * @param customServer       {string}
 * @param customTitle        {string|null}
 * @param customDescription  {string|null}
 */
export function startRecommend(
    customServer,
    customTitle = null,
    customDescription = null
) {
    if (initDone === false) {
        init(customServer);
    }

    try {
        if (null === customTitle) {
            customTitle = document.title
        }

        if (null === customDescription) {
            let metaDescription = document.querySelector('meta[name="description"]');

            if (null !== metaDescription) {
                customDescription = metaDescription.content;
            }
        }

        let tmpArray = {
            iframeAction: 'store',
            title: customTitle,
            description: customDescription,
            url: window.location.href,
        };
        sendData(
            viewIframe,
            tmpArray,
            server
        );
    } catch (e) {
        console.log(e);
    }
}

/**
 * @param projectId  {number}
 */
export function sendAutoConversion(projectId) {
    sendConversionAction(server, lastAutoEntryId, projectId);
}

/**
 * @param projectId  {number}
 */
export function sendAutoEntries(projectId) {
    let jsonLDArray = document.querySelectorAll('script[type="application/ld+json"]');
    jsonLDArray.forEach(function (jsonLDElement) {
        sendAutoEntry(jsonLDElement, projectId);
    });
}

/**
 * @param jsonLDElement
 * @param projectId  {number}
 */
export function sendAutoEntry(jsonLDElement, projectId) {
    let xhr = new XMLHttpRequest();
    xhr.open('POST', server + 'auto-entry', true);
    let data = new FormData();
    data.append('autoEntryBody', jsonLDElement.innerText);
    data.append('projectId', projectId.toString());
    data.append('url', window.location.href);
    xhr.onloadend = function () {
        let responseArray = JSON.parse(xhr.responseText);

        if (responseArray['entryId']) {
            sendClickAction(server, responseArray['entryId'], projectId); // TODO: must be sendViewAction() in future
            lastAutoEntryId = responseArray['entryId'];
            autoEntryIds[responseArray['entryId']] = responseArray['entryId'];
        }
    }
    xhr.send(data);
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
    let xhr = new XMLHttpRequest();
    xhr.open('POST', server + 'custom-entry', true);
    let data = new FormData();
    data.append('customEntryBody', entryJson);
    data.append('projectId', projectId.toString());
    data.append('customTitle', customTitle);
    data.append('customDescription', customDescription);
    data.append('customImageUrl', customImageUrl);
    data.append('customUrl', customUrl);
    data.append('uniqueEntryId', uniqueEntryId.toString());
    xhr.send(data);
}

/**
 * @param customServer       {string}
 * @param uniqueEntryId      {number}
 * @param projectId          {number}
 * @param customTitle        {string|null}
 * @param customDescription  {string|null}
 * @param url                {string|null}
 * @param userHistoryId      {string|null}
 */
export function sendViewAction(
    customServer,
    uniqueEntryId,
    projectId,
    customTitle = null,
    customDescription = null,
    url = null,
    userHistoryId = null
) {
    sendCustomAction(customServer, 1, uniqueEntryId, projectId, customTitle, customDescription, url, userHistoryId);
}

/**
 * @param customServer       {string}
 * @param uniqueEntryId      {number}
 * @param projectId          {number}
 * @param customTitle        {string|null}
 * @param customDescription  {string|null}
 * @param url                {string|null}
 * @param userHistoryId      {string|null}
 */
export function sendClickAction(
    customServer,
    uniqueEntryId,
    projectId,
    customTitle = null,
    customDescription = null,
    url = null,
    userHistoryId = null
) {
    sendCustomAction(customServer, 2, uniqueEntryId, projectId, customTitle, customDescription, url, userHistoryId);
}

/**
 * @param customServer       {string}
 * @param uniqueEntryId      {number}
 * @param projectId          {number}
 * @param customTitle        {string|null}
 * @param customDescription  {string|null}
 * @param url                {string|null}
 * @param userHistoryId      {string|null}
 */
export function sendConversionAction(
    customServer,
    uniqueEntryId,
    projectId,
    customTitle = null,
    customDescription = null,
    url = null,
    userHistoryId = null
) {
    sendCustomAction(customServer, 3, uniqueEntryId, projectId, customTitle, customDescription, url, userHistoryId);
}

/**
 * @param customServer       {string}
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
function sendCustomAction(
    customServer,
    action,
    uniqueEntryId,
    projectId,
    customTitle = null,
    customDescription = null,
    url = null,
    userHistoryId = null
) {
    if (initDone === false) {
        init(customServer);
    }

    if (null === customTitle) {
        customTitle = document.title
    }

    if (null === customDescription) {
        let metaDescription = document.querySelector('meta[name="description"]');

        if (null !== metaDescription) {
            customDescription = metaDescription.content;
        }
    }

    if (null === url) {
        url = window.location.href;
    }

    let clickData = {
        action: action,
        clientId: uniqueEntryId,
        projectId: projectId,
        title: customTitle,
        description: customDescription,
        url: url,
        userHistoryId: userHistoryId,
        iframeAction: 'action',
        debugUrl: window.location.href,
    };
    sendData(
        viewIframe,
        clickData,
        server + 'saveMeta'
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