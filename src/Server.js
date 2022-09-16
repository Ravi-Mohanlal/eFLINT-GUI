export var uuid = null

export function launchServer() {
    const requestOptions = {
        method: 'POST',
        body: JSON.stringify({'template-name': 'src/main/resources/templates/empty.eflint'})
    }

    return fetch('http://localhost:8080/create', requestOptions)
    .then(response => response.json())
    .then(data => {uuid = data.data.uuid})
}

export function executePhrase(phrase) {
    const requestOptions = {
        method: 'POST',
        body: JSON.stringify({uuid: uuid, 'request-type': 'command', data: {command: 'phrase', text: phrase}})
    }

    return fetch('http://localhost:8080/command', requestOptions)
    .then(response => response.json())
    .then(data => {return data})
}

export function history() {
    const requestOptions = {
        method: 'POST',
        body: JSON.stringify({uuid: uuid, 'request-type': 'command', data: {command: 'create-export'}})
    }

    return fetch('http://localhost:8080/command', requestOptions)
    .then(response => response.json())
    .then(data => {return data})
}

export function revert(id) {
    const requestOptions = {
        method: 'POST',
        body: JSON.stringify({uuid: uuid, 'request-type': 'command', data: {command: 'revert', value: id, destructive: true}})
    }

    return fetch('http://localhost:8080/command', requestOptions)
    .then(response => response.json())
    .then(data => {return data})
}

export function jump(id) {
    const requestOptions = {
        method: 'POST',
        body: JSON.stringify({uuid: uuid, 'request-type': 'command', data: {command: 'revert', value: id}})
    }

    return fetch('http://localhost:8080/command', requestOptions)
    .then(response => response.json())
    .then(data => {return data})
}

export function terminateServer() {
    fetch('http://localhost:8080/kill_all', {method: 'POST'})
}
