
enum DeviceResponseStatus {
    SUCCESS,
    MEM_ERROR,
    FAIL
}

class DeviceResponse {

    public readonly status: DeviceResponseStatus
    public readonly data: any

    constructor(status: DeviceResponseStatus, data: any) {
        this.status = status
        this.data = data
    }

    static success(data?: any) {
        return new DeviceResponse(DeviceResponseStatus.SUCCESS, data)
    }

    static memError(data?:any) {
        return new DeviceResponse(DeviceResponseStatus.MEM_ERROR, data)
    }

    static fail(data?: any) {
        return new DeviceResponse(DeviceResponseStatus.FAIL, data)
    }
}

export { DeviceResponse, DeviceResponseStatus }
