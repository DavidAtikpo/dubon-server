/**
 * Utilitaires pour la gestion des dates
 */

// Formater une date en string lisible
export const formatDate = (date) => {
  if (!date) return null;
  return new Date(date).toLocaleString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Vérifier si une date est expirée
export const isExpired = (date) => {
  if (!date) return true;
  return new Date(date) < new Date();
};

// Ajouter des jours à une date
export const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

// Obtenir le début de la journée
export const startOfDay = (date) => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

// Obtenir la fin de la journée
export const endOfDay = (date) => {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
};

// Calculer la différence en jours entre deux dates
export const daysBetween = (date1, date2) => {
  const oneDay = 24 * 60 * 60 * 1000; // heures*minutes*secondes*millisecondes
  const firstDate = new Date(date1);
  const secondDate = new Date(date2);
  return Math.round(Math.abs((firstDate - secondDate) / oneDay));
};

// Vérifier si une date est aujourd'hui
export const isToday = (date) => {
  const today = new Date();
  const compareDate = new Date(date);
  return compareDate.getDate() === today.getDate() &&
    compareDate.getMonth() === today.getMonth() &&
    compareDate.getFullYear() === today.getFullYear();
};

// Obtenir une date relative (ex: "il y a 2 jours")
export const getRelativeDate = (date) => {
  const now = new Date();
  const diff = now - new Date(date);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor(diff / (1000 * 60));

  if (days > 0) {
    return `il y a ${days} jour${days > 1 ? 's' : ''}`;
  } else if (hours > 0) {
    return `il y a ${hours} heure${hours > 1 ? 's' : ''}`;
  } else if (minutes > 0) {
    return `il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
  } else {
    return 'à l\'instant';
  }
};

// Formater une durée en texte lisible
export const formatDuration = (minutes) => {
  if (minutes < 60) {
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  let result = `${hours} heure${hours > 1 ? 's' : ''}`;
  if (remainingMinutes > 0) {
    result += ` ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}`;
  }
  return result;
}; 