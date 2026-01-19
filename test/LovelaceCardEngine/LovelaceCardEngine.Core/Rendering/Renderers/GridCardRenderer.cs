using System;
using LovelaceCardEngine.Core.Models;
using LovelaceCardEngine.Core.Services;
using LovelaceCardEngine.Core.Rendering;

namespace LovelaceCardEngine.Core.Rendering.Renderers
{
    /// <summary>
    /// Renders grid layout card
    /// </summary>
    public class GridCardRenderer : ICardRenderer
    {
        private readonly CardRendererFactory _factory;

        public GridCardRenderer(CardRendererFactory factory)
        {
            _factory = factory;
        }

        public bool CanRender(string cardType) => cardType == "grid";

        public RenderedCard Render(CardConfig config, IEntityStore entityStore)
        {
            var gridConfig = config as GridCardConfig
                ?? throw new ArgumentException("Invalid grid card config");

            var columns = gridConfig.Columns ?? 3;
            var html = $"<div class='grid-card' style='display:grid;grid-template-columns:repeat({columns},1fr);gap:16px'>";

            var rendered = new RenderedCard("grid", html)
            {
                Title = gridConfig.Title,
                Icon = gridConfig.Icon,
                ChildCards = new(),
                GridColumns = columns
            };

            foreach (var card in gridConfig.Cards)
            {
                var renderedChild = _factory.Render(card, entityStore);
                rendered.ChildCards.Add(renderedChild);
            }

            rendered.Content = html + string.Join("", rendered.ChildCards.Select(c => $"<div>{c.Content}</div>")) + "</div>";

            return rendered;
        }
    }
}
