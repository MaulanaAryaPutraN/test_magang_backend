const responses = (status,massage,data,res) =>{
    res.status(status_code).json({
        output: {
            status_codes : "status",
            massages : "massage",
            datas : "data"
        }
    })
}