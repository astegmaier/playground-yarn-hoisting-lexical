exports.load = async (url, context, defaultLoad) => {
  console.log(`Importing: ${url}`);
  return await defaultLoad(url, context);
};
