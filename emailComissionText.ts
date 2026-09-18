const { Client, Messaging } = require('node-appwrite');

module.exports = async ({ req, res, log, error }) => {
  const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const messaging = new Messaging(client);

  let payload;
  try {
    payload = JSON.parse(req.body);
  } catch (e) {
    error('Invalid JSON payload');
    return res.json({ success: false, message: 'Invalid JSON payload' }, 400);
  }

  const {
    to,
    subject,
    userName,
    storeName,
    storeType,
    commissionPercentage,
    viewRate,
    commissionToken,
    acceptedDate,
  } = payload;

  if (!to || !commissionToken) {
    error('Missing required fields: to, commissionToken');
    return res.json({ success: false, message: 'Missing required fields' }, 400);
  }

  const date = new Date(acceptedDate).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #001524; padding: 20px; text-align: center;">
        <h1 style="color: #ffecd1; margin: 0;">Cegget</h1>
      </div>
      <div style="padding: 30px; background-color: #f9f9f9;">
        <p>Bonjour <strong>${userName}</strong>,</p>
        <p>Votre inscription en tant que commerçant a été enregistrée avec les commissions suivantes :</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr style="background-color: #15616d; color: #ffecd1;">
            <td style="padding: 12px; font-weight: bold;">Magasin</td>
            <td style="padding: 12px;">${storeName}</td>
          </tr>
          <tr style="background-color: #e8e9eb;">
            <td style="padding: 12px; font-weight: bold;">Type d'activité</td>
            <td style="padding: 12px;">${storeType}</td>
          </tr>
          <tr style="background-color: #15616d; color: #ffecd1;">
            <td style="padding: 12px; font-weight: bold;">Commission sur commandes</td>
            <td style="padding: 12px;">${commissionPercentage}%</td>
          </tr>
          <tr style="background-color: #e8e9eb;">
            <td style="padding: 12px; font-weight: bold;">Commission sur les vues</td>
            <td style="padding: 12px;">${viewRate} DA / vue</td>
          </tr>
        </table>
        <div style="background-color: #e8e9eb; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; font-size: 12px; color: #313630;">Token de confirmation :</p>
          <p style="margin: 5px 0 0 0; font-family: monospace; font-size: 14px; color: #001524; word-break: break-all;">${commissionToken}</p>
        </div>
        <p style="font-size: 12px; color: #313630;">Date d'acceptation : ${date}</p>
        <p style="font-size: 12px; color: #313630; font-style: italic;">Conservez cet email comme preuve d'acceptation des termes.</p>
      </div>
      <div style="background-color: #78290f; padding: 10px; text-align: center;">
        <p style="color: #ffecd1; margin: 0; font-size: 12px;">© Cegget - Tous droits réservés</p>
      </div>
    </div>
  `;

  try {
    await messaging.createEmail(
      'unique()',
      subject,
      htmlContent,
      [],
      [to],
      [],
      [],
      [],
      [],
      false,
      true
    );
    log('Commission confirmation email sent to: ' + to);
    return res.json({ success: true });
  } catch (e) {
    error('Failed to send email: ' + e.message);
    return res.json({ success: false, message: e.message }, 500);
  }
};