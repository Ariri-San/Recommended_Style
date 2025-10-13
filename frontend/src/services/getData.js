import request from "./requestService.js";

export async function getData(url, id) {
    try {
        const response = await request.getObjects(url, id);
        console.log(response);
        return response.data;
    } catch (error) {
        console.log(error);
    }
}

export async function setData(setState, state, url, options={}, id) {
    try {
        const response = await request.getObjects(url, id);
        return setState({ ...state, data: response.data, ...options});
    } catch (error) {
        if (error.data) request.showError(error);
        return setState({ show: false });
    }
}

const functions = {
    setData,
    getData
};

export default functions;

