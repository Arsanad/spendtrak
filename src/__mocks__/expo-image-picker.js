module.exports = {
  launchImageLibraryAsync: jest.fn().mockResolvedValue({
    canceled: false,
    assets: [{ uri: 'mock-uri' }],
  }),
  MediaTypeOptions: { Images: 'Images' },
};
