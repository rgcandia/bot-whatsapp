const { DataTypes } = require('sequelize');
module.exports= (sequelize)=>{
    sequelize.define('user',{
        name :{
            type:DataTypes.STRING,
        },
        phone:{
            type:DataTypes.BIGINT,
            primaryKey: true,
        },
        password:{
        type:DataTypes.STRING,
        },
        

    }, {
        timestamps:false,
      });
};
